-- =======================================
-- Seed Data - Necesidades de la Casa Ronald McDonald
-- Valery/Melanie: Editen estos textos con los reales
-- =======================================

INSERT INTO need_card (title, description, category, emoji, goal_amount, current_amount, donors_count, is_urgent, deadline) VALUES
('Gasolina para traslados seguros al hospital', 'La camioneta de la Casa Ronald necesita tanque lleno para trasladar a 8 familias a sus citas médicas esta semana.', 'transporte', '⛽', 1200, 780, 18, true, '12 horas');

INSERT INTO need_card (title, description, category, emoji, goal_amount, current_amount, donors_count, is_urgent, deadline) VALUES
('Cena especial de viernes para 20 familias', 'Cada viernes, las familias de la Casa se reúnen para una cena especial. Es el único momento de normalidad en semanas de hospital.', 'alimentacion', '🍕', 1500, 450, 9, false, '3 días');

INSERT INTO need_card (title, description, category, emoji, goal_amount, current_amount, donors_count, is_urgent, deadline) VALUES
('Kits de higiene para mamás cuidadoras', 'Las mamás que están 24/7 al lado de sus hijos muchas veces olvidan cuidarse a sí mismas. Un kit con shampoo, jabón y crema les recuerda que ellas también importan.', 'higiene', '🧴', 800, 600, 14, false, '5 días');

INSERT INTO need_card (title, description, category, emoji, goal_amount, current_amount, donors_count, is_urgent, deadline) VALUES
('Tarde de cine para los niños de la Casa', 'Palomitas, cobijas y una película. Para un niño en tratamiento, una tarde así es una ventana de alegría pura.', 'bienestar', '🎬', 600, 150, 5, false, '7 días');

INSERT INTO need_card (title, description, category, emoji, goal_amount, current_amount, donors_count, is_urgent, deadline) VALUES
('Material escolar para no perder el año', 'Los niños en tratamiento llevan meses fuera de la escuela. Con cuadernos, colores y material didáctico, los voluntarios les ayudan a no quedarse atrás.', 'educacion', '📚', 950, 950, 22, false, 'Completada');

INSERT INTO need_card (title, description, category, emoji, goal_amount, current_amount, donors_count, is_urgent, deadline) VALUES
('Desayunos nutritivos de emergencia', 'Llegaron 5 familias nuevas esta semana y la despensa se acabó antes de lo previsto. Necesitamos cubrir desayunos para los próximos 4 días.', 'alimentacion', '🥣', 2000, 320, 7, true, '24 horas');
