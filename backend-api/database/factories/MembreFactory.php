<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Membre>
 */
class MembreFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
   public function definition(): array
{
    return [
        'nom' => $this->faker->lastName(),
        'postnom' => $this->faker->firstName(),
        'prenom' => $this->faker->firstName(),
        'sexe' => $this->faker->firstName(),
        'telephone' => $this->faker->phoneNumber(),
        'adresse' => $this->faker->address(),
    ];
}
}
