package tn.rnu.isetmd.event.category.service;

import tn.rnu.isetmd.event.category.dto.CategoryRequest;
import tn.rnu.isetmd.event.category.dto.CategoryResponse;

import java.util.List;

public interface CategoryService {
    List<CategoryResponse> getAllCategories();
    CategoryResponse getCategoryById(Long id);
    CategoryResponse createCategory(CategoryRequest request);
    CategoryResponse updateCategory(Long id, CategoryRequest request);
    void deleteCategory(Long id);
}
