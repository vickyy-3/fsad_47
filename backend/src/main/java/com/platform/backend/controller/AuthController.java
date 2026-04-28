package com.platform.backend.controller;

import com.platform.backend.dto.*;
import com.platform.backend.entity.OtpToken;
import com.platform.backend.entity.Role;
import com.platform.backend.entity.User;
import com.platform.backend.repository.OtpTokenRepository;
import com.platform.backend.repository.UserRepository;
import com.platform.backend.security.JwtUtils;
import com.platform.backend.security.UserDetailsImpl;
import com.platform.backend.service.OtpDeliveryService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.Random;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    OtpTokenRepository otpTokenRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    @Autowired
    OtpDeliveryService otpDeliveryService;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        String contact = loginRequest.getContact();
        if (contact != null && contact.contains("@") && !contact.matches("^[A-Za-z0-9+_.-]+@gmail\\.com$")) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Only valid @gmail.com email addresses are allowed."));
        }
        
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getContact(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        
        User user = userRepository.findById(userDetails.getId()).orElse(null);
        if (user != null) {
            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);
        }

        String role = userDetails.getAuthorities().iterator().next().getAuthority();

        return ResponseEntity.ok(new JwtResponse(jwt,
                userDetails.getId(),
                userDetails.getName(),
                userDetails.getUsername(), // returns contact
                role));
    }

    @PostMapping("/request-otp")
    public ResponseEntity<?> requestOtp(@Valid @RequestBody OtpRequest otpRequest) {
        String contact = otpRequest.getContact();

        if (contact == null || contact.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Contact cannot be empty."));
        }

        if (contact.contains("@")) {
            if (!contact.matches("^[A-Za-z0-9+_.-]+@gmail\\.com$")) {
                return ResponseEntity.badRequest().body(new MessageResponse("Error: Only valid @gmail.com email addresses are allowed."));
            }
        } else {
            if (!contact.matches("^\\+?[1-9]\\d{1,14}$")) {
                return ResponseEntity.badRequest().body(new MessageResponse("Error: Invalid phone number format. Must be E.164 (e.g., +1234567890)."));
            }
        }

        if (userRepository.existsByEmail(contact) || userRepository.existsByPhone(contact)) {
             return ResponseEntity.badRequest().body(new MessageResponse("Error: Contact is already in use!"));
        }

        // Generate 6-digit OTP
        String otp = String.format("%06d", new Random().nextInt(999999));
        
        OtpToken otpToken = new OtpToken();
        otpToken.setContact(contact);
        otpToken.setOtpCode(otp);
        otpToken.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        otpTokenRepository.save(otpToken);

        // Send real OTP via email or SMS
        try {
            otpDeliveryService.sendOtp(contact, otp);
        } catch (Exception e) {
            // Delete the token if delivery failed
            otpTokenRepository.delete(otpToken);
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }

        return ResponseEntity.ok(new MessageResponse("OTP sent successfully. Check console log."));
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        String contact = signUpRequest.getContact();
        
        if (contact != null && contact.contains("@") && !contact.endsWith("@gmail.com")) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Only @gmail.com email addresses are allowed."));
        }
        
        // 1. Verify OTP
        OtpToken token = otpTokenRepository.findByContactAndOtpCode(contact, signUpRequest.getOtpCode())
            .orElse(null);

        if (token == null || token.getExpiresAt().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Invalid or expired OTP."));
        }

        // 2. Validate availability
        if (userRepository.existsByEmail(contact) || userRepository.existsByPhone(contact)) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Contact is already registered!"));
        }

        // 3. Create new user account
        User user = new User();
        user.setName(signUpRequest.getName());
        user.setPasswordHash(encoder.encode(signUpRequest.getPassword()));
        user.setIsVerified(true);

        if (contact.contains("@")) {
            user.setEmail(contact);
        } else {
            user.setPhone(contact);
        }

        // FORCE ROLE_RESEARCHER for all new self-registrations to prevent Privilege Escalation
        user.setRole(Role.RESEARCHER);

        userRepository.save(user);
        otpTokenRepository.delete(token);

        return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
    }
}
