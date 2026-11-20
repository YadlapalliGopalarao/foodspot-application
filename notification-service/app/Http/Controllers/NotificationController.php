<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $userId = $request->attributes->get(
            'authenticated_user_id'
        );

        $notifications = Notification::where(
            'user_id', $userId
        )->latest()->get();

        return response()->json($notifications);
    }

    public function store(Request $request)
    {
        $secret = config('services.notification_service.key');

        if (!$secret || !hash_equals(
            $secret, (string) $request->bearerToken()
        )) {
            return response()->json([
                'message' => 'Unauthorized service'
            ], 401);
        }

        $validated = $request->validate([
            'user_id' => 'required|integer|min:1',
            'order_id' => 'required|integer|min:1',
            'event' => 'required|in:placed,cancelled'
        ]);

        $orderId = $validated['order_id'];

        $message = match ($validated['event']) {
            'placed' => "Order #{$orderId} placed successfully",
            'cancelled' => "Order #{$orderId} has been cancelled",
        };

        $notification = Notification::firstOrCreate(
            [
                'order_id' => $orderId,
                'event' => $validated['event']
            ],
            [
                'user_id' => $validated['user_id'],
                'message' => $message
            ]
        );

        return response()->json(
            $notification,
            $notification->wasRecentlyCreated ? 201 : 200
        );
    }
}
