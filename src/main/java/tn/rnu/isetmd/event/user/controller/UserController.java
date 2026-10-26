package tn.rnu.isetmd.event.user.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import tn.rnu.isetmd.event.config.SecurityUtils;
import tn.rnu.isetmd.event.user.dto.ChangePasswordRequest;
import tn.rnu.isetmd.event.user.dto.UpdateProfileRequest;
import tn.rnu.isetmd.event.user.dto.UserResponse;
import tn.rnu.isetmd.event.user.service.UserService;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    UserResponse getProfile() {
        return userService.getUserById(SecurityUtils.getCurrentUserId());
    }

    @PutMapping("/me")
    UserResponse updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        return userService.updateProfile(SecurityUtils.getCurrentUserId(), request);
    }

    @PutMapping("/me/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(SecurityUtils.getCurrentUserId(), request);
    }

}
