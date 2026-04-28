package com.platform.backend.service;

import com.platform.backend.entity.Notification;
import com.platform.backend.entity.Project;
import com.platform.backend.entity.ProjectMember;
import com.platform.backend.entity.User;
import com.platform.backend.repository.NotificationRepository;
import com.platform.backend.repository.ProjectMemberRepository;
import com.platform.backend.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ProjectMemberRepository projectMemberRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void notifyProjectTeam(Long projectId, String message, String type, String actionUrl, Long excludeUserId) {
        Project project = projectRepository.findById(projectId).orElse(null);
        if (project == null) return;

        Set<User> recipients = new HashSet<>();
        
        // Add creator
        if (project.getCreatedBy() != null) {
            recipients.add(project.getCreatedBy());
        }

        // Add team members
        List<ProjectMember> members = projectMemberRepository.findByProjectId(projectId);
        for (ProjectMember m : members) {
            recipients.add(m.getUser());
        }

        for (User user : recipients) {
            if (excludeUserId != null && user.getId().equals(excludeUserId)) {
                continue; // don't notify the person who triggered it
            }

            Notification notification = new Notification();
            notification.setUser(user);
            notification.setMessage(message);
            notification.setType(type);
            notification.setActionUrl(actionUrl);
            
            Notification saved = notificationRepository.save(notification);

            // Broadcast
            messagingTemplate.convertAndSend("/topic/notifications/" + user.getId(), saved);
        }
    }
}
