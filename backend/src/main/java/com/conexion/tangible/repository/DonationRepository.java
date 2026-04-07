package com.conexion.tangible.repository;

import com.conexion.tangible.model.Donation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DonationRepository extends JpaRepository<Donation, Long> {
    List<Donation> findByNeedCardId(Long needCardId);
}
