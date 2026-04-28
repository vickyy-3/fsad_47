package com.platform.backend.controller;

import com.platform.backend.entity.User;
import com.platform.backend.repository.UserRepository;
import com.platform.backend.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import com.platform.backend.entity.Project;
import com.platform.backend.entity.Document;
import com.platform.backend.repository.ProjectRepository;
import com.platform.backend.repository.DocumentRepository;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, String> payload) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findById(userDetails.getId()).orElse(null);
        if (user == null) return ResponseEntity.badRequest().body("User not found");

        if (payload.containsKey("name")) user.setName(payload.get("name"));
        if (payload.containsKey("phone")) {
            String phone = payload.get("phone");
            if (phone != null && !phone.isEmpty() && !phone.matches("^\\+?[1-9]\\d{1,14}$")) {
                return ResponseEntity.badRequest().body(Map.of("message", "Error: Invalid phone number format. Must be E.164 (e.g., +1234567890)."));
            }
            user.setPhone(phone);
        }
        if (payload.containsKey("email")) {
            String email = payload.get("email");
            if (email != null && !email.isEmpty() && !email.matches("^[A-Za-z0-9+_.-]+@gmail\\.com$")) {
                return ResponseEntity.badRequest().body(Map.of("message", "Error: Only valid @gmail.com email addresses are allowed."));
            }
            user.setEmail(email);
        }
        
        userRepository.save(user);
        return ResponseEntity.ok(user);
    }

    @PostMapping("/profile/image")
    public ResponseEntity<?> uploadProfileImage(@RequestParam("file") MultipartFile file) {
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            User user = userRepository.findById(userDetails.getId()).orElse(null);
            if (user == null) return ResponseEntity.badRequest().body("User not found");

            // Ensure directory exists
            String uploadDir = "backend_uploads/profiles/";
            java.io.File directory = new java.io.File(uploadDir);
            if (!directory.exists()) {
                directory.mkdirs();
            }

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null || originalFilename.isEmpty()) {
                originalFilename = "uploaded_image.png";
            }
            String fileName = UUID.randomUUID().toString() + "_" + originalFilename.replaceAll("[^a-zA-Z0-9\\.\\-]", "_");
            Path filePath = Paths.get(uploadDir + fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Update user profileImageUrl
            String fileUrl = "/uploads/profiles/" + fileName;
            user.setProfileImageUrl(fileUrl);
            userRepository.save(user);

            return ResponseEntity.ok(Map.of("message", "Profile image updated successfully", "profileImageUrl", fileUrl));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Could not upload the image: " + e.getMessage()));
        }
    }

    @GetMapping("/profile/stats")
    public ResponseEntity<?> getProfileStats() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findById(userDetails.getId()).orElse(null);
        if (user == null) return ResponseEntity.badRequest().body("User not found");

        List<Project> userProjects = projectRepository.findByCreatedById(user.getId());
        long totalProjects = userProjects.size();
        
        List<Map<String, Object>> recentActivity = new ArrayList<>();
        long totalDocuments = 0;
        
        for (Project p : userProjects) {
            List<Document> docs = documentRepository.findByProjectIdOrderByUploadedAtDesc(p.getId());
            totalDocuments += docs.size();
            for (Document d : docs) {
                Map<String, Object> activity = new HashMap<>();
                activity.put("type", "document_upload");
                activity.put("title", "Uploaded document: " + (d.getFileName() != null ? d.getFileName() : "Unnamed"));
                activity.put("date", d.getUploadedAt() != null ? d.getUploadedAt() : java.time.LocalDateTime.now());
                activity.put("projectId", p.getId());
                recentActivity.add(activity);
            }
            Map<String, Object> pActivity = new HashMap<>();
            pActivity.put("type", "project_creation");
            pActivity.put("title", "Created project: " + (p.getTitle() != null ? p.getTitle() : "Unnamed"));
            pActivity.put("date", p.getCreatedAt() != null ? p.getCreatedAt() : java.time.LocalDateTime.now());
            pActivity.put("projectId", p.getId());
            recentActivity.add(pActivity);
        }

        // Add login activity if exists
        if (user.getLastLogin() != null) {
            Map<String, Object> lActivity = new HashMap<>();
            lActivity.put("type", "login");
            lActivity.put("title", "Logged into system");
            lActivity.put("date", user.getLastLogin());
            lActivity.put("projectId", 0);
            recentActivity.add(lActivity);
        }

        // Sort activity by date descending and limit to top 5
        recentActivity.sort((a, b) -> ((java.time.LocalDateTime) b.get("date")).compareTo((java.time.LocalDateTime) a.get("date")));
        if (recentActivity.size() > 5) {
            recentActivity = recentActivity.subList(0, 5);
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("user", user);
        stats.put("totalProjects", totalProjects);
        stats.put("totalDocuments", totalDocuments);
        stats.put("recentActivity", recentActivity);

        return ResponseEntity.ok(stats);
    }

    @GetMapping
    public ResponseEntity<?> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }
}
