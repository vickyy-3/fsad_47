package com.platform.backend.controller;

import com.platform.backend.entity.Document;
import com.platform.backend.entity.Project;
import com.platform.backend.entity.User;
import com.platform.backend.repository.DocumentRepository;
import com.platform.backend.repository.MilestoneRepository;
import com.platform.backend.repository.ProjectRepository;
import com.platform.backend.repository.UserRepository;
import com.platform.backend.repository.ProjectMemberRepository;
import com.platform.backend.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private MilestoneRepository milestoneRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectMemberRepository projectMemberRepository;

    @Autowired
    private com.platform.backend.repository.CommentRepository commentRepository;

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        boolean isAdmin = userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        Long userId = userDetails.getId();

        Map<String, Object> response = new HashMap<>();

        List<Project> relevantProjects;
        List<Document> relevantDocuments = new ArrayList<>();
        long projectCount, docCount, pendingCount, userCount;

        if (isAdmin) {
            projectCount = projectRepository.count();
            docCount = documentRepository.count();
            pendingCount = milestoneRepository.count();
            userCount = userRepository.count();

            relevantProjects = projectRepository.findAll();
            for (Project p : relevantProjects) {
                relevantDocuments.addAll(documentRepository.findByProjectIdOrderByUploadedAtDesc(p.getId()));
            }
        } else {
            relevantProjects = projectRepository.findByCreatedById(userId);
            projectCount = relevantProjects.size();
            for (Project p : relevantProjects) {
                relevantDocuments.addAll(documentRepository.findByProjectIdOrderByUploadedAtDesc(p.getId()));
            }
            docCount = relevantDocuments.size();
            pendingCount = projectMemberRepository.findByUserId(userId).size(); // Approximate pending milestones for user
            userCount = projectMemberRepository.findByUserId(userId).size(); // Approximate collaborators
        }

        response.put("projects", projectCount);
        response.put("documents", docCount);
        response.put("pending", pendingCount);
        response.put("users", userCount);

        // Build Chart Data (Last 5 Months)
        List<Map<String, Object>> chartData = buildChartData(relevantProjects, relevantDocuments);
        response.put("chartData", chartData);

        // Build Recent Activity Feed
        List<Map<String, Object>> recentActivity = buildRecentActivity(relevantProjects, relevantDocuments, userDetails);
        response.put("recentActivity", recentActivity);

        return ResponseEntity.ok(response);
    }

    private List<Map<String, Object>> buildChartData(List<Project> projects, List<Document> documents) {
        List<Map<String, Object>> chart = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        DateTimeFormatter monthFormatter = DateTimeFormatter.ofPattern("MMM");

        for (int i = 4; i >= 0; i--) {
            LocalDateTime targetMonth = now.minusMonths(i);
            String monthName = targetMonth.format(monthFormatter);

            long pCount = projects.stream()
                    .filter(p -> p.getCreatedAt() != null && p.getCreatedAt().getMonth() == targetMonth.getMonth() && p.getCreatedAt().getYear() == targetMonth.getYear())
                    .count();

            long dCount = documents.stream()
                    .filter(d -> d.getUploadedAt() != null && d.getUploadedAt().getMonth() == targetMonth.getMonth() && d.getUploadedAt().getYear() == targetMonth.getYear())
                    .count();

            Map<String, Object> monthData = new HashMap<>();
            monthData.put("name", monthName);
            monthData.put("projects", pCount);
            monthData.put("documents", dCount);
            chart.add(monthData);
        }
        return chart;
    }

    private List<Map<String, Object>> buildRecentActivity(List<Project> projects, List<Document> documents, UserDetailsImpl currentUser) {
        List<Map<String, Object>> activity = new ArrayList<>();

        for (Project p : projects) {
            Map<String, Object> item = new HashMap<>();
            item.put("action", "Created new project");
            item.put("target", p.getTitle() != null ? p.getTitle() : "Untitled Project");
            item.put("dateObj", p.getCreatedAt() != null ? p.getCreatedAt() : LocalDateTime.now());
            item.put("time", formatTimeAgo(p.getCreatedAt()));
            item.put("user", getInitials(p.getCreatedBy()));
            activity.add(item);
        }

        for (Document d : documents) {
            Map<String, Object> item = new HashMap<>();
            item.put("action", "Uploaded a document");
            item.put("target", d.getFileName() != null ? d.getFileName() : "Unnamed Document");
            item.put("dateObj", d.getUploadedAt() != null ? d.getUploadedAt() : LocalDateTime.now());
            item.put("time", formatTimeAgo(d.getUploadedAt()));
            item.put("user", getInitials(d.getUploadedBy()));
            activity.add(item);
        }

        // Fetch milestones for these projects
        for (Project p : projects) {
            List<com.platform.backend.entity.Milestone> milestones = milestoneRepository.findByProjectId(p.getId());
            for (com.platform.backend.entity.Milestone m : milestones) {
                // Milestone Creation
                Map<String, Object> createItem = new HashMap<>();
                createItem.put("action", "Created a milestone");
                createItem.put("target", m.getTitle());
                createItem.put("dateObj", m.getCreatedAt() != null ? m.getCreatedAt() : LocalDateTime.now());
                createItem.put("time", formatTimeAgo(m.getCreatedAt()));
                createItem.put("user", "System"); // Since creator is not tracked directly in Milestone entity
                activity.add(createItem);

                // Milestone Completion
                if (m.getStatus() == com.platform.backend.entity.MilestoneStatus.COMPLETED || m.getStatus() == com.platform.backend.entity.MilestoneStatus.VERIFIED) {
                    Map<String, Object> completeItem = new HashMap<>();
                    completeItem.put("action", "Completed milestone");
                    completeItem.put("target", m.getTitle());
                    completeItem.put("dateObj", m.getUpdatedAt() != null ? m.getUpdatedAt() : LocalDateTime.now());
                    completeItem.put("time", formatTimeAgo(m.getUpdatedAt()));
                    completeItem.put("user", getInitials(m.getCompletedBy()));
                    activity.add(completeItem);
                }
            }

            // Fetch comments for this project
            List<com.platform.backend.entity.Comment> projComments = commentRepository.findByTargetTypeAndTargetIdOrderByCreatedAtAsc("PROJECT", p.getId());
            for (com.platform.backend.entity.Comment c : projComments) {
                Map<String, Object> commentItem = new HashMap<>();
                commentItem.put("action", "Commented on project");
                commentItem.put("target", p.getTitle());
                commentItem.put("dateObj", c.getCreatedAt() != null ? c.getCreatedAt() : LocalDateTime.now());
                commentItem.put("time", formatTimeAgo(c.getCreatedAt()));
                commentItem.put("user", getInitials(c.getAuthor()));
                activity.add(commentItem);
            }
        }

        // Sort descending
        activity.sort((a, b) -> ((LocalDateTime) b.get("dateObj")).compareTo((LocalDateTime) a.get("dateObj")));

        // Limit to 5
        if (activity.size() > 5) {
            activity = activity.subList(0, 5);
        }

        return activity;
    }

    private String getInitials(User user) {
        if (user == null || user.getName() == null || user.getName().isEmpty()) return "U";
        String[] parts = user.getName().split(" ");
        if (parts.length >= 2) {
            return (parts[0].substring(0, 1) + parts[1].substring(0, 1)).toUpperCase();
        }
        return user.getName().substring(0, 1).toUpperCase();
    }

    private String formatTimeAgo(LocalDateTime time) {
        if (time == null) return "Just now";
        long minutes = ChronoUnit.MINUTES.between(time, LocalDateTime.now());
        if (minutes < 1) return "Just now";
        if (minutes < 60) return minutes + " mins ago";
        long hours = ChronoUnit.HOURS.between(time, LocalDateTime.now());
        if (hours < 24) return hours + " hours ago";
        long days = ChronoUnit.DAYS.between(time, LocalDateTime.now());
        if (days == 1) return "Yesterday";
        return days + " days ago";
    }
}
