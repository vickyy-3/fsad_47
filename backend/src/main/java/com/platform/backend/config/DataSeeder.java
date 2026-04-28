package com.platform.backend.config;

import com.platform.backend.entity.Role;
import com.platform.backend.entity.User;
import com.platform.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${admin1.email}")
    private String admin1Email;

    @Value("${admin1.password}")
    private String admin1Password;

    @Value("${admin2.email}")
    private String admin2Email;

    @Value("${admin2.password}")
    private String admin2Password;

    @Override
    public void run(String... args) throws Exception {
        createAdminIfNotFound(admin1Email, admin1Password, "System Admin 1");
        createAdminIfNotFound(admin2Email, admin2Password, "System Admin 2");
    }

    private void createAdminIfNotFound(String email, String password, String name) {
        if (!userRepository.existsByEmail(email)) {
            User admin = new User();
            admin.setName(name);
            admin.setEmail(email);
            admin.setPasswordHash(passwordEncoder.encode(password));
            admin.setRole(Role.ADMIN);
            admin.setIsVerified(true);
            userRepository.save(admin);
            System.out.println("Created admin user: " + email);
        }
    }
}
