package com.conexion.tangible.controller;

import com.conexion.tangible.model.Donation;
import com.conexion.tangible.model.NeedCard;
import com.conexion.tangible.repository.DonationRepository;
import com.conexion.tangible.repository.NeedCardRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*") // CORS abierto para el hackathon
public class CardController {

    private final NeedCardRepository needCardRepo;
    private final DonationRepository donationRepo;

    public CardController(NeedCardRepository needCardRepo, DonationRepository donationRepo) {
        this.needCardRepo = needCardRepo;
        this.donationRepo = donationRepo;
    }

    // ==================
    // GET /api/cards
    // Lista todas las necesidades
    // ==================
    @GetMapping("/cards")
    public List<NeedCard> getAllCards() {
        return needCardRepo.findAll();
    }

    // ==================
    // GET /api/cards/{id}
    // Detalle de una necesidad
    // ==================
    @GetMapping("/cards/{id}")
    public ResponseEntity<NeedCard> getCard(@PathVariable Long id) {
        return needCardRepo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ==================
    // GET /api/cards/urgent
    // Solo necesidades urgentes
    // ==================
    @GetMapping("/cards/urgent")
    public List<NeedCard> getUrgentCards() {
        return needCardRepo.findByIsUrgentTrue();
    }

    // ==================
    // POST /api/cards/{id}/donate
    // Body: { "amount": 50, "donorName": "Anónimo" }
    // ==================
    @PostMapping("/cards/{id}/donate")
    public ResponseEntity<?> donate(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return needCardRepo.findById(id).map(card -> {
            Double amount = Double.valueOf(body.get("amount").toString());
            String donorName = body.getOrDefault("donorName", "Anónimo").toString();

            // Actualizar la tarjeta
            double newAmount = Math.min(card.getCurrentAmount() + amount, card.getGoalAmount());
            card.setCurrentAmount(newAmount);
            card.setDonorsCount(card.getDonorsCount() + 1);
            needCardRepo.save(card);

            // Registrar la donación
            Donation donation = new Donation();
            donation.setNeedCardId(id);
            donation.setAmount(amount);
            donation.setDonorName(donorName);
            donation.setCreatedAt(LocalDateTime.now());
            donationRepo.save(donation);

            return ResponseEntity.ok(card);
        }).orElse(ResponseEntity.notFound().build());
    }

    // ==================
    // GET /api/donations/{needId}
    // Historial de donaciones de una tarjeta
    // ==================
    @GetMapping("/donations/{needId}")
    public List<Donation> getDonations(@PathVariable Long needId) {
        return donationRepo.findByNeedCardId(needId);
    }
}
