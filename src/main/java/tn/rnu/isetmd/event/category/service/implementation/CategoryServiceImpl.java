package tn.rnu.isetmd.event.category.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.rnu.isetmd.event.category.dto.CategoryRequest;
import tn.rnu.isetmd.event.category.dto.CategoryResponse;
import tn.rnu.isetmd.event.category.entity.Category;
import tn.rnu.isetmd.event.category.mapper.CategoryMapper;
import tn.rnu.isetmd.event.category.repository.CategoryRepository;
import tn.rnu.isetmd.event.category.service.CategoryService;
import tn.rnu.isetmd.event.common.exception.ConflictException;
import tn.rnu.isetmd.event.common.exception.NotFoundException;
import tn.rnu.isetmd.event.event.repository.EventRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;
    private final EventRepository eventRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAllByOrderByNameAsc().stream()
                .map(categoryMapper::toCategoryResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryResponse getCategoryById(Long id) {
        return categoryMapper.toCategoryResponse(findCategory(id));
    }

    @Override
    public CategoryResponse createCategory(CategoryRequest request) {
        if (categoryRepository.existsByNameIgnoreCase(request.name().trim())) {
            throw new ConflictException("A category with this name already exists");
        }
        Category category = new Category();
        categoryMapper.updateEntity(category, request);
        return categoryMapper.toCategoryResponse(categoryRepository.save(category));
    }

    @Override
    public CategoryResponse updateCategory(Long id, CategoryRequest request) {
        Category category = findCategory(id);
        if (categoryRepository.existsByNameIgnoreCaseAndIdNot(request.name().trim(), id)) {
            throw new ConflictException("A category with this name already exists");
        }
        categoryMapper.updateEntity(category, request);
        return categoryMapper.toCategoryResponse(categoryRepository.save(category));
    }

    @Override
    public void deleteCategory(Long id) {
        Category category = findCategory(id);
        if (eventRepository.existsByCategoryId(id)) {
            throw new ConflictException("This category is used by existing events");
        }
        categoryRepository.delete(category);
    }

    private Category findCategory(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Category not found"));
    }
}
