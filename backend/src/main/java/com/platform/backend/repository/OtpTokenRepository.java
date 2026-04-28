package com.platform.backend.repository;

import com.platform.backend.entity.OtpToken;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface OtpTokenRepository extends JpaRepository<OtpToken, Long> {
    Optional<OtpToken> findByContactAndOtpCode(String contact, String otpCode);
    void deleteByContact(String contact);
}
