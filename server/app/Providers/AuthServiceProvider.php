<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Auth; // Import Auth facade
use App\Models\Company;
use App\Models\Employee;
use App\Providers\MultiAuthUserProvider; // IMPORTANT: Ensure this import is correct and file exists

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        // You can define policies here later if needed, e.g.,
        // \App\Models\Company::class => \App\Policies\CompanyPolicy::class,
        // \App\Models\Employee::class => \App\Policies\EmployeePolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        // Define a gate to check if the authenticated user is a Company instance
        Gate::define('isCompany', function ($user) {
            return $user instanceof Company;
        });

        // Define a gate to check if the authenticated user is an Employee instance
        Gate::define('isEmployee', function ($user) {
            return $user instanceof Employee;
        });

        // IMPORTANT: Register your custom multi-auth user provider here
        // This closure is executed when Laravel needs to create the 'eloquent_multi' provider.
        Auth::provider('eloquent_multi', function ($app, array $config) {
            // Ensure that $config['models'] is passed correctly from config/auth.php
            // and that MultiAuthUserProvider is correctly imported.
            return new MultiAuthUserProvider($app['hash'], $config['models']);
        });
    }
}

