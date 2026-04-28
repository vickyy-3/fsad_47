package com.platform.backend.repository;

import com.platform.backend.entity.ProjectMember;
import com.platform.backend.entity.ProjectMemberId;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProjectMemberRepository extends JpaRepository<ProjectMember, ProjectMemberId> {
    List<ProjectMember> findByUserId(Long userId);
    List<ProjectMember> findByProjectId(Long projectId);
}
