package tn.rnu.isetmd.event.category.mapper;

import org.springframework.stereotype.Component;
import tn.rnu.isetmd.event.category.dto.CategoryRequest;
import tn.rnu.isetmd.event.category.dto.CategoryResponse;
import tn.rnu.isetmd.event.category.entity.Category;

@Component
public class CategoryMapper {

    public CategoryResponse toCategoryResponse(Category category) {
        return new CategoryResponse(category.getId(), category.getName(), category.getDescription(), category.getImage());
    }

    public void updateEntity(Category category, CategoryRequest request) {
        category.setName(request.name().trim());
        category.setDescription(request.description());
        category.setImage(request.image());
    }

}
