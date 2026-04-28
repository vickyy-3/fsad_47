package com.platform.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class OtpRequest {
    @NotBlank
    private String contact;
    public String getContact() { return contact; }
    public void setContact(String contact) { this.contact = contact; }
}
