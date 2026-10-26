package tn.rnu.isetmd.event.user.service;

import tn.rnu.isetmd.event.common.dto.PageResponse;
import tn.rnu.isetmd.event.enums.UserRole;
import tn.rnu.isetmd.event.user.dto.ChangePasswordRequest;
import tn.rnu.isetmd.event.user.dto.UpdateProfileRequest;
import tn.rnu.isetmd.event.user.dto.UserResponse;
import tn.rnu.isetmd.event.user.entity.User;

public interface UserService {
    User getUserEntity(Long userId);
    UserResponse getUserById(Long userId);
    UserResponse updateProfile(Long userId, UpdateProfileRequest request);
    void changePassword(Long userId, ChangePasswordRequest request);
    PageResponse<UserResponse> searchUsers(String search, UserRole role, int page, int size);
    UserResponse updateRole(Long currentUserId, Long userId, UserRole role);
    UserResponse updateStatus(Long currentUserId, Long userId, boolean enabled);
}
