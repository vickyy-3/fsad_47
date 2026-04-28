package com.platform.backend.service;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class OtpDeliveryService {

    @Autowired(required = false)
    private JavaMailSender emailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    @Value("${twilio.account-sid:}")
    private String twilioAccountSid;

    @Value("${twilio.auth-token:}")
    private String twilioAuthToken;

    @Value("${twilio.phone-number:}")
    private String twilioPhoneNumber;

    private boolean isTwilioConfigured = false;

    @PostConstruct
    public void initTwilio() {
        System.out.println("Initializing Twilio Service...");
        
        // Check if SID is valid (not empty and not a placeholder)
        if (twilioAccountSid != null && !twilioAccountSid.isEmpty() && !twilioAccountSid.contains("your-twilio")) {
            try {
                Twilio.init(twilioAccountSid, twilioAuthToken);
                isTwilioConfigured = true;
                System.out.println("[SUCCESS] Twilio initialized with SID: " + twilioAccountSid);
            } catch (Exception e) {
                System.err.println("[FAILURE] Twilio initialization failed: " + e.getMessage());
                isTwilioConfigured = false;
            }
        } else {
            System.out.println("[WARNING] Twilio not configured properly. Current SID: " + twilioAccountSid);
            isTwilioConfigured = false;
        }
    }

    public void sendOtp(String contact, String otp) {
        if (contact.contains("@")) {
            sendEmailOtp(contact, otp);
        } else {
            sendSmsOtp(contact, otp);
        }
    }

    private void sendEmailOtp(String toEmail, String otp) {
        if (fromEmail == null || fromEmail.isEmpty() || fromEmail.contains("your-email")) {
            System.out.println("[DEV MODE FALLBACK] Email OTP for " + toEmail + " is: " + otp);
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Your Registration OTP Code");
            message.setText("Welcome to the Academic Research Platform!\n\nYour OTP code is: " + otp + "\n\nThis code will expire in 10 minutes.");
            emailSender.send(message);
            System.out.println("[SUCCESS] Email sent successfully to: " + toEmail);
        } catch (Exception e) {
            System.err.println("[FAILURE] Failed to send email to " + toEmail + ". Error: " + e.getMessage());
            throw new RuntimeException("Error: Failed to send OTP to email. Please check configuration.");
        }
    }

    private void sendSmsOtp(String toPhoneNumber, String otp) {
        // Fallback for unconfigured Twilio
        if (!isTwilioConfigured) {
            System.out.println("\n==========================================");
            System.out.println("[DEV MODE] Twilio is NOT configured!");
            System.out.println("To send real SMS, update application.properties with valid Twilio credentials.");
            System.out.println("-> SMS OTP for " + toPhoneNumber + " is: " + otp);
            System.out.println("==========================================\n");
            // We do not throw an error here so the UI can proceed in DEV MODE.
            return;
        }

        // Try to send the real SMS
        try {
            System.out.println("Attempting to send SMS to " + toPhoneNumber + " via Twilio Number " + twilioPhoneNumber);
            Message message = Message.creator(
                    new PhoneNumber(toPhoneNumber),       // To
                    new PhoneNumber(twilioPhoneNumber),   // From
                    "Your Academic Research Platform OTP code is: " + otp
            ).create();
            
            System.out.println("[SUCCESS] SMS sent successfully to: " + toPhoneNumber + ". Message SID: " + message.getSid());
        } catch (Exception e) {
            System.err.println("[FAILURE] Twilio SMS failed to send to " + toPhoneNumber + ".");
            System.err.println("[TWILIO ERROR LOG] " + e.getMessage());
            // If the user's Twilio account has no balance, unverified numbers, or invalid token, it fails here.
            throw new RuntimeException("Error: Failed to send OTP via SMS. " + e.getMessage());
        }
    }
}
