package tn.rnu.isetmd.event.user.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.rnu.isetmd.event.common.dto.PageResponse;
import tn.rnu.isetmd.event.common.exception.BadRequestException;
import tn.rnu.isetmd.event.common.exception.NotFoundException;
import tn.rnu.isetmd.event.enums.UserRole;
import tn.rnu.isetmd.event.user.dto.ChangePasswordRequest;
import tn.rnu.isetmd.event.user.dto.UpdateProfileRequest;
import tn.rnu.isetmd.event.user.dto.UserResponse;
import tn.rnu.isetmd.event.user.entity.User;
import tn.rnu.isetmd.event.user.mapper.UserMapper;
import tn.rnu.isetmd.event.user.repository.UserRepository;
import tn.rnu.isetmd.event.user.service.UserService;

import java.util.Objects;

@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public User getUserEntity(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long userId) {
        return userMapper.toUserResponse(getUserEntity(userId));
    }

    @Override
    public UserResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = getUserEntity(userId);
        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());
        user.setProfileImage(request.profileImage());
        return userMapper.toUserResponse(userRepository.save(user));
    }

    @Override
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = getUserEntity(userId);

        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<UserResponse> searchUsers(String search, UserRole role, int page, int size) {
        PageRequest pageable = PageRequest.of(page, Math.min(size, 100), Sort.by("createdAt").descending());
        return PageResponse.from(
                userRepository.search(search == null ? "" : search.trim(), role, pageable),
                userMapper::toUserResponse
        );
    }

    @Override
    public UserResponse updateRole(Long currentUserId, Long userId, UserRole role) {
        if (Objects.equals(currentUserId, userId)) {
            throw new BadRequestException("You cannot change your own role");
        }
        User user = getUserEntity(userId);
        user.setRole(role);
        return userMapper.toUserResponse(userRepository.save(user));
    }

    @Override
    public UserResponse updateStatus(Long currentUserId, Long userId, boolean enabled) {
        if (Objects.equals(currentUserId, userId)) {
            throw new BadRequestException("You cannot disable your own account");
        }
        User user = getUserEntity(userId);
        user.setEnabled(enabled);
        return userMapper.toUserResponse(userRepository.save(user));
    }
}
