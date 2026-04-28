package com.platform.backend.controller;

import com.platform.backend.entity.Project;
import com.platform.backend.entity.User;
import com.platform.backend.repository.UserRepository;
import com.platform.backend.service.ProjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import com.platform.backend.security.UserDetailsImpl;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import com.platform.backend.security.UserDetailsImpl;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/projects")
public class ProjectController {
    @Autowired
    private ProjectService projectService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public List<Project> getAllProjects() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        
        // Admins see all projects
        if (userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return projectService.getAllProjects();
        }

        // Researchers only see their own
        return projectService.getProjectsByUser(userDetails.getId());
    }

    @PostMapping
    public Project createProject(@RequestBody Project project) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findById(userDetails.getId()).orElseThrow();
        project.setCreatedBy(user);
        return projectService.createProject(project);
    }

    @GetMapping("/{id}")
    public Project getProjectById(@PathVariable Long id) {
        return projectService.getProjectById(id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
        return ResponseEntity.ok("Deleted");
    }

    @PutMapping("/{id}")
    public Project updateProject(@PathVariable Long id, @RequestBody Project projectDetails) {
        Project project = projectService.getProjectById(id);
        project.setTitle(projectDetails.getTitle());
        project.setDescription(projectDetails.getDescription());
        project.setStatus(projectDetails.getStatus());
        return projectService.createProject(project);
    }

    @Autowired
    private com.platform.backend.repository.ProjectMemberRepository projectMemberRepository;

    @GetMapping("/{id}/members")
    public ResponseEntity<?> getProjectMembers(@PathVariable Long id) {
        return ResponseEntity.ok(projectMemberRepository.findByProjectId(id));
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<?> addProjectMember(@PathVariable("id") Long projectId, @RequestBody java.util.Map<String, Long> payload) {
        Long userId = payload.get("userId");
        if (userId == null) return ResponseEntity.badRequest().body("User ID required");
        
        User user = userRepository.findById(userId).orElse(null);
        Project project = projectService.getProjectById(projectId);
        if (user == null || project == null) return ResponseEntity.badRequest().body("User or Project not found");

        com.platform.backend.entity.ProjectMember member = new com.platform.backend.entity.ProjectMember();
        member.setProject(project);
        member.setUser(user);
        // By default, just giving them MEMBER since Admin manages it
        projectMemberRepository.save(member);
        
        return ResponseEntity.ok(member);
    }

    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<?> removeProjectMember(@PathVariable("id") Long projectId, @PathVariable("userId") Long userId) {
        com.platform.backend.entity.ProjectMemberId pk = new com.platform.backend.entity.ProjectMemberId(projectId, userId);
        projectMemberRepository.deleteById(pk);
        return ResponseEntity.ok("Member removed");
    }
}
