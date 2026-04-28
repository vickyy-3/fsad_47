package com.platform.backend.controller;

import com.platform.backend.entity.Comment;
import com.platform.backend.entity.User;
import com.platform.backend.repository.CommentRepository;
import com.platform.backend.repository.UserRepository;
import com.platform.backend.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/comments")
public class CommentController {

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private com.platform.backend.service.NotificationService notificationService;

    @GetMapping("/{targetType}/{targetId}")
    public ResponseEntity<?> getComments(@PathVariable String targetType, @PathVariable Long targetId) {
        List<Comment> comments = commentRepository.findByTargetTypeAndTargetIdOrderByCreatedAtAsc(targetType.toUpperCase(), targetId);
        return ResponseEntity.ok(comments);
    }

    @PostMapping("/{targetType}/{targetId}")
    public ResponseEntity<?> addComment(@PathVariable String targetType, @PathVariable Long targetId, @RequestBody Map<String, String> payload) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User currentUser = userRepository.findById(userDetails.getId()).orElseThrow(() -> new RuntimeException("User not found"));

        String content = payload.get("content");
        if (content == null || content.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Content is required");
        }

        Comment comment = new Comment();
        comment.setContent(content);
        comment.setTargetType(targetType.toUpperCase());
        comment.setTargetId(targetId);
        comment.setAuthor(currentUser);

        Comment savedComment = commentRepository.save(comment);

        // Broadcast to WebSocket clients
        String destination = "/topic/comments/" + targetType.toUpperCase() + "/" + targetId;
        messagingTemplate.convertAndSend(destination, savedComment);

        // Trigger Notification if target is PROJECT
        if ("PROJECT".equalsIgnoreCase(targetType)) {
            String msg = currentUser.getName() + " commented: " + (content.length() > 30 ? content.substring(0, 30) + "..." : content);
            notificationService.notifyProjectTeam(targetId, msg, "COMMENT", "/projects/" + targetId, currentUser.getId());
        }

        return ResponseEntity.ok(savedComment);
    }
}
