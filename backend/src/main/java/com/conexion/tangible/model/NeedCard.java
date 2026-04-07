package com.conexion.tangible.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "need_card")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NeedCard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false)
    private String category; // transporte, alimentacion, higiene, bienestar, educacion

    private String emoji;

    @Column(nullable = false)
    private Double goalAmount;

    @Column(nullable = false)
    private Double currentAmount = 0.0;

    private Integer donorsCount = 0;

    private Boolean isUrgent = false;

    private String deadline;
}
