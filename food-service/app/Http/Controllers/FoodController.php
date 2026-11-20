<?php

namespace App\Http\Controllers;

use App\Models\Food;
use Illuminate\Http\Request;

class FoodController extends Controller
{
    // Retrieve all foods
    public function index()
    {
        return response()->json(Food::all());
    }

    // Retrieve a particular food
    public function show(Food $food)
    {
        return response()->json($food);
    }

    // Create a food
    public function store(Request $request)
    {
        $validated = $this->validateFood($request);

        $food = Food::create($validated);

        return response()->json($food, 201);
    }

    // Update a food
    public function update(Request $request, Food $food)
    {
        $validated = $this->validateFood($request);

        $food->update($validated);

        return response()->json($food);
    }

    // Delete a food
    public function destroy(Food $food)
    {
        $food->delete();

        return response()->noContent();
    }

    // Validate food details
    private function validateFood(Request $request): array
    {
        return $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:5000',
            'price' => 'required|numeric|min:0.01|max:99999999.99|decimal:0,2',
            'category' => 'required|string|max:255',
            'image_url' => 'nullable|url:http,https|max:2048',
            'emoji' => 'nullable|string|max:20'
        ]);
    }
}

