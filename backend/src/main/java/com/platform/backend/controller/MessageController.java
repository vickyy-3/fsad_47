package com.platform.backend.controller;

import com.platform.backend.entity.Message;
import com.platform.backend.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/messages")
public class MessageController {

    @Autowired
    private MessageRepository messageRepository;

    @GetMapping("/project/{projectId}")
    public List<Message> getMessagesByProject(@PathVariable Long projectId) {
        return messageRepository.findByProjectIdOrderBySentAtAsc(projectId);
    }

    @PostMapping
    public Message createMessage(@RequestBody Message message) {
        return messageRepository.save(message);
    }
}
