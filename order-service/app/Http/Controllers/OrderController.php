<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Client\ConnectionException;

class OrderController extends Controller
{
    // Retrieve current user's orders
    public function index(Request $request)
    {
        $orders = Order::with('items')
            ->where('user_id', $this->userId($request))
            ->latest()
            ->get();

        return response()->json($orders);
    }

    // Retrieve an individual order
    public function show(Request $request, $id)
    {
        $order = Order::with('items')
            ->where('user_id', $this->userId($request))
            ->findOrFail($id);

        return response()->json($order);
    }

    // Place a new order
    public function store(Request $request)
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1|max:20',
            'items.*.food_id' => 'required|integer|min:1|distinct',
            'items.*.quantity' => 'required|integer|min:1|max:99'
        ]);

        // Retrieve actual food information
        try {
            $response = Http::acceptJson()
                ->withoutRedirecting()
                ->connectTimeout(2)
                ->timeout(5)
                ->get(
                    config('services.food_service.url')
                    . '/api/foods'
                );

        } catch (ConnectionException $e) {
            return response()->json([
                'message' => 'Food service unavailable'
            ], 503);
        }

        if (!$response->successful() ||
            !is_array($response->json()) ||
            !array_is_list($response->json())) {

            return response()->json([
                'message' => 'Unable to retrieve food information'
            ], 503);
        }

        $foods = collect($response->json())->keyBy('id');

        $total = 0;
        $orderItems = [];

        foreach ($validated['items'] as $item) {

            $food = $foods->get((int) $item['food_id']);

            if (!$food) {
                return response()->json([
                    'message' => 'Selected food is unavailable'
                ], 422);
            }

            // Convert the price to integer paise
            $price = (string) $food['price'];

            if (!preg_match('/^\d{1,8}(\.\d{1,2})?$/D', $price)) {
                return response()->json([
                    'message' => 'Invalid food price'
                ], 503);
            }

            [$whole, $fraction] = array_pad(
                explode('.', $price, 2), 2, ''
            );

            $priceInPaise = ((int) $whole * 100)
                + (int) str_pad($fraction, 2, '0');

            if ($priceInPaise <= 0) {
                return response()->json([
                    'message' => 'Invalid food price'
                ], 503);
            }

            $total += $priceInPaise * $item['quantity'];

            $orderItems[] = [
                'food_id' => $food['id'],
                'name' => $food['name'],
                'price' => $this->money($priceInPaise),
                'quantity' => $item['quantity']
            ];
        }

        // Save order and items using a transaction
        $order = DB::transaction(function () use (
            $request, $total, $orderItems
        ) {
            $order = Order::create([
                'user_id' => $this->userId($request),
                'total' => $this->money($total),
                'status' => 'Placed'
            ]);

            $order->items()->createMany($orderItems);

            return $order->load('items');
        });

        // Send order placed notification
        $this->sendNotification($order, 'placed');

        return response()->json($order, 201);
    }

    // Cancel an existing order
    public function cancel(Request $request, $id)
    {
        $order = Order::where(
            'user_id', $this->userId($request)
        )->findOrFail($id);

        $updated = Order::whereKey($order->id)
            ->where('status', 'Placed')
            ->update([
                'status' => 'Cancelled'
            ]);

        if (!$updated) {
            return response()->json([
                'message' => 'Order cannot be cancelled'
            ], 409);
        }

        // Send order cancellation notification
        $this->sendNotification($order, 'cancelled');

        return response()->json(
            $order->refresh()->load('items')
        );
    }

    // Communicate with Notification Service
    private function sendNotification(
        Order $order,
        string $event
    ): void {
        $url = config('services.notification_service.url');
        $key = config('services.notification_service.key');

        // Check notification configuration
        if (!$url || !$key) {
            Log::warning('Notification configuration missing', [
                'order_id' => $order->id
            ]);

            return;
        }

        try {
            $response = Http::acceptJson()
                ->withToken($key)
                ->withoutRedirecting()
                ->connectTimeout(2)
                ->timeout(5)
                ->post(
                    rtrim($url, '/') . '/api/internal/notifications',
                    [
                        'user_id' => $order->user_id,
                        'order_id' => $order->id,
                        'event' => $event
                    ]
                );

            if (!$response->successful()) {
                Log::warning('Notification creation failed', [
                    'order_id' => $order->id,
                    'status' => $response->status()
                ]);
            }

        } catch (ConnectionException $e) {
            Log::warning('Notification service unavailable', [
                'order_id' => $order->id
            ]);
        }
    }

    // Retrieve authenticated user ID
    private function userId(Request $request)
    {
        return $request->attributes->get(
            'authenticated_user_id'
        );
    }

    // Convert paise into rupees
    private function money(int $paise): string
    {
        return sprintf(
            '%d.%02d',
            intdiv($paise, 100),
            $paise % 100
        );
    }
}
