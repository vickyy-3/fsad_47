package com.platform.backend.controller;

import com.platform.backend.entity.Document;
import com.platform.backend.entity.Project;
import com.platform.backend.entity.User;
import com.platform.backend.repository.DocumentRepository;
import com.platform.backend.repository.ProjectRepository;
import com.platform.backend.repository.UserRepository;
import com.platform.backend.security.UserDetailsImpl;
import com.platform.backend.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @GetMapping
    public List<Document> getAllDocuments() {
        return documentRepository.findAll();
    }

    @GetMapping("/project/{projectId}")
    public List<Document> getByProject(@PathVariable Long projectId) {
        // Return only the latest versions for the project
        return documentRepository.findLatestDocumentsByProjectId(projectId);
    }

    @GetMapping("/history/{groupId}")
    public List<Document> getDocumentHistory(@PathVariable String groupId) {
        return documentRepository.findByDocumentGroupIdOrderByVersionDesc(groupId);
    }

    @Autowired
    private com.platform.backend.service.NotificationService notificationService;

    @PostMapping(value = "/upload", consumes = {"multipart/form-data"})
    public ResponseEntity<?> uploadDocument(
            @RequestParam("file") MultipartFile file, 
            @RequestParam("projectId") Long projectId,
            @RequestParam(value = "documentGroupId", required = false) String documentGroupId) {
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            User user = userRepository.findById(userDetails.getId()).orElse(null);
            Project project = projectRepository.findById(projectId).orElse(null);

            if (user == null || project == null) return ResponseEntity.badRequest().body("Invalid project or user.");

            String filePath = fileStorageService.storeFile(file);

            Document doc = new Document();
            doc.setProject(project);
            doc.setUploadedBy(user);
            doc.setFileName(file.getOriginalFilename());
            doc.setFilePath(filePath);
            doc.setFileSize(file.getSize());
            doc.setFileType(file.getContentType());

            boolean isNewVersion = false;
            if (documentGroupId != null && !documentGroupId.isEmpty() && !documentGroupId.equals("undefined")) {
                List<Document> history = documentRepository.findByDocumentGroupIdOrderByVersionDesc(documentGroupId);
                if (!history.isEmpty()) {
                    doc.setDocumentGroupId(documentGroupId);
                    doc.setVersion(history.get(0).getVersion() + 1);
                    isNewVersion = true;
                } else {
                    doc.setDocumentGroupId(documentGroupId);
                    doc.setVersion(1);
                }
            } else {
                doc.setDocumentGroupId(UUID.randomUUID().toString());
                doc.setVersion(1);
            }
            
            documentRepository.save(doc);

            // Trigger notification
            String msg = user.getName() + (isNewVersion ? " uploaded a new version of " : " uploaded document ") + doc.getFileName();
            notificationService.notifyProjectTeam(projectId, msg, "DOCUMENT", "/projects/" + projectId, user.getId());

            return ResponseEntity.ok(doc);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body("Could not parse file logic.");
        }
    }

    @GetMapping("/download/{id}")
    public ResponseEntity<Resource> downloadDocument(@PathVariable Long id) {
        Document document = documentRepository.findById(id).orElse(null);
        if (document == null) return ResponseEntity.notFound().build();

        Path path = fileStorageService.loadFileAsResource(document.getFilePath());
        try {
            Resource resource = new UrlResource(path.toUri());
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(document.getFileType() != null ? document.getFileType() : "application/octet-stream"))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + document.getFileName() + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/preview/{id}")
    public ResponseEntity<Resource> previewDocument(@PathVariable Long id) {
        Document document = documentRepository.findById(id).orElse(null);
        if (document == null) return ResponseEntity.notFound().build();

        Path path = fileStorageService.loadFileAsResource(document.getFilePath());
        try {
            Resource resource = new UrlResource(path.toUri());
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(document.getFileType() != null ? document.getFileType() : "application/octet-stream"))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + document.getFileName() + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDocument(@PathVariable Long id) {
        Document document = documentRepository.findById(id).orElse(null);
        if (document != null) {
            // Delete all versions
            if (document.getDocumentGroupId() != null) {
                 List<Document> allVersions = documentRepository.findByDocumentGroupIdOrderByVersionDesc(document.getDocumentGroupId());
                 documentRepository.deleteAll(allVersions);
            } else {
                 documentRepository.delete(document);
            }
        }
        return ResponseEntity.ok("Deleted");
    }
}
