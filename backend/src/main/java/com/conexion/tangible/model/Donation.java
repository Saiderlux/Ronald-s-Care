package com.conexion.tangible.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "donation")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Donation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long needCardId;

    @Column(nullable = false)
    private Double amount;

    private String donorName; // Opcional, puede ser "Anónimo"

    private LocalDateTime createdAt = LocalDateTime.now();
}
