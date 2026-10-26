package tn.rnu.isetmd.event.admin.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.rnu.isetmd.event.admin.dto.AdminStatsResponse;
import tn.rnu.isetmd.event.admin.service.AdminService;
import tn.rnu.isetmd.event.common.dto.PageResponse;
import tn.rnu.isetmd.event.config.SecurityUtils;
import tn.rnu.isetmd.event.enums.UserRole;
import tn.rnu.isetmd.event.user.dto.UpdateUserRoleRequest;
import tn.rnu.isetmd.event.user.dto.UpdateUserStatusRequest;
import tn.rnu.isetmd.event.user.dto.UserResponse;
import tn.rnu.isetmd.event.user.service.UserService;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final UserService userService;

    @GetMapping("/stats")
    AdminStatsResponse getStats() {
        return adminService.getStats();
    }

    @GetMapping("/users")
    PageResponse<UserResponse> searchUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UserRole role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return userService.searchUsers(search, role, page, size);
    }

    @PatchMapping("/users/{userId}/role")
    UserResponse updateRole(@PathVariable Long userId, @Valid @RequestBody UpdateUserRoleRequest request) {
        return userService.updateRole(SecurityUtils.getCurrentUserId(), userId, request.role());
    }

    @PatchMapping("/users/{userId}/status")
    UserResponse updateStatus(@PathVariable Long userId, @Valid @RequestBody UpdateUserStatusRequest request) {
        return userService.updateStatus(SecurityUtils.getCurrentUserId(), userId, request.enabled());
    }

}
