package com.platform.backend.repository;

import com.platform.backend.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByProjectIdOrderByUploadedAtDesc(Long projectId);

    List<Document> findByDocumentGroupIdOrderByVersionDesc(String documentGroupId);

    @org.springframework.data.jpa.repository.Query("SELECT d FROM Document d WHERE d.id IN (SELECT MAX(d2.id) FROM Document d2 WHERE d2.project.id = :projectId GROUP BY d2.documentGroupId) ORDER BY d.uploadedAt DESC")
    List<Document> findLatestDocumentsByProjectId(@org.springframework.data.repository.query.Param("projectId") Long projectId);
}
