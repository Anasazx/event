package tn.rnu.isetmd.event.category.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.rnu.isetmd.event.category.entity.Category;

public interface CategoryRepository extends JpaRepository<Category, Long> {
}
