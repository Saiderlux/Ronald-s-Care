package com.conexion.tangible.repository;

import com.conexion.tangible.model.NeedCard;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NeedCardRepository extends JpaRepository<NeedCard, Long> {
    List<NeedCard> findByCategory(String category);
    List<NeedCard> findByIsUrgentTrue();
}
