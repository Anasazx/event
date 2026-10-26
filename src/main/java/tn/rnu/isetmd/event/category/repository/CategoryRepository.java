package tn.rnu.isetmd.event.category.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.rnu.isetmd.event.category.entity.Category;

import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    boolean existsByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
    List<Category> findAllByOrderByNameAsc();
}
