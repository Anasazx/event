package tn.rnu.isetmd.event.user.mapper;

import org.springframework.stereotype.Component;
import tn.rnu.isetmd.event.user.dto.UserResponse;
import tn.rnu.isetmd.event.user.entity.User;

@Component
public class UserMapper {

    public UserResponse toUserResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getRole(),
                user.getProfileImage(),
                user.isEnabled(),
                user.getCreatedAt()
        );
    }

}
