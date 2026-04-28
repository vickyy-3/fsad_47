package com.platform.backend.security;

import com.platform.backend.entity.User;
import com.platform.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired
    UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String contact) throws UsernameNotFoundException {
        User user = userRepository.findByEmailOrPhone(contact, contact)
                .orElseThrow(() -> new UsernameNotFoundException("User Not Found with contact: " + contact));

        return UserDetailsImpl.build(user);
    }
}
