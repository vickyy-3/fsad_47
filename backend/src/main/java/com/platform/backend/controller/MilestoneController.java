package com.platform.backend.controller;

import com.platform.backend.entity.Milestone;
import com.platform.backend.entity.Project;
import com.platform.backend.repository.MilestoneRepository;
import com.platform.backend.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.context.SecurityContextHolder;
import com.platform.backend.security.UserDetailsImpl;
import com.platform.backend.repository.UserRepository;
import com.platform.backend.entity.User;
import com.platform.backend.entity.MilestoneStatus;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/milestones")
public class MilestoneController {

    @Autowired
    private MilestoneRepository milestoneRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/project/{projectId}")
    public List<Milestone> getProjectMilestones(@PathVariable Long projectId) {
        return milestoneRepository.findByProjectId(projectId);
    }

    @PostMapping("/project/{projectId}")
    public ResponseEntity<?> createMilestone(@PathVariable Long projectId, @RequestBody Milestone payload) {
        Project p = projectRepository.findById(projectId).orElse(null);
        if (p == null) return ResponseEntity.badRequest().body("Project not found");
        payload.setProject(p);
        Milestone saved = milestoneRepository.save(payload);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateMilestone(@PathVariable Long id, @RequestBody Milestone payload) {
        Milestone existing = milestoneRepository.findById(id).orElse(null);
        if (existing == null) return ResponseEntity.badRequest().body("Milestone not found");
        existing.setTitle(payload.getTitle());
        existing.setDescription(payload.getDescription());
        existing.setStatus(payload.getStatus());
        existing.setDueDate(payload.getDueDate());
        milestoneRepository.save(existing);
        return ResponseEntity.ok(existing);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMilestone(@PathVariable Long id) {
        milestoneRepository.deleteById(id);
        return ResponseEntity.ok("Deleted");
    }

    @Autowired
    private com.platform.backend.service.NotificationService notificationService;

    @PostMapping("/{id}/complete")
    public ResponseEntity<?> completeMilestone(@PathVariable Long id) {
        Milestone existing = milestoneRepository.findById(id).orElse(null);
        if (existing == null) return ResponseEntity.badRequest().body("Milestone not found");

        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User currentUser = userRepository.findById(userDetails.getId()).orElse(null);

        existing.setStatus(MilestoneStatus.COMPLETED);
        existing.setCompletedBy(currentUser);
        milestoneRepository.save(existing);

        String msg = "Milestone completed: " + existing.getTitle() + " by " + currentUser.getName();
        notificationService.notifyProjectTeam(existing.getProject().getId(), msg, "MILESTONE", "/projects/" + existing.getProject().getId(), currentUser.getId());

        return ResponseEntity.ok(existing);
    }

    @PostMapping("/{id}/verify")
    public ResponseEntity<?> verifyMilestone(@PathVariable Long id) {
        Milestone existing = milestoneRepository.findById(id).orElse(null);
        if (existing == null) return ResponseEntity.badRequest().body("Milestone not found");

        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        boolean isAdmin = userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin) return ResponseEntity.status(403).body("Only Admins can verify milestones.");

        User currentUser = userRepository.findById(userDetails.getId()).orElse(null);
        existing.setStatus(MilestoneStatus.VERIFIED);
        existing.setVerifiedBy(currentUser);
        milestoneRepository.save(existing);

        String msg = "Milestone verified: " + existing.getTitle() + " by " + currentUser.getName();
        notificationService.notifyProjectTeam(existing.getProject().getId(), msg, "MILESTONE", "/projects/" + existing.getProject().getId(), currentUser.getId());

        return ResponseEntity.ok(existing);
    }
}
