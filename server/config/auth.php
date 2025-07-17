<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Authentication Defaults
    |--------------------------------------------------------------------------
    |
    | This option controls the default authentication "guard" and password
    | reset options for your application. You may change these defaults
    | as required, but they're a perfect start for most applications.
    |
    */

    'defaults' => [
        'guard' => 'web', // Keep 'web' as default for session-based routes if any, even if not used for API
        'passwords' => 'users', // Can remain 'users' or be updated if you define specific password reset flows for company/employee
    ],

    /*
    |--------------------------------------------------------------------------
    | Authentication Guards
    |--------------------------------------------------------------------------
    |
    | Next, you may define every authentication guard for your application.
    | Of course, a great default configuration has been defined for you
    | here. Here are the authentication guards for this application.
    |
    | All authentication drivers have a user provider. The "providers" array has
    | already been defined for you below. Here you may define each of the
    | authentication drivers for your application.
    |
    */

    'guards' => [
        'web' => [
            'driver' => 'session',
            'provider' => 'users', // Keep this, even if 'users' table isn't used, as it's a default Laravel setup.
        ],
        'sanctum' => [
            'driver' => 'sanctum',
            // IMPORTANT: This provider will be used by Sanctum.
            // It must point to your custom multi-auth provider.
            'provider' => 'multi_auth_provider',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | User Providers
    |--------------------------------------------------------------------------
    |
    | All authentication drivers have a user provider. This defines how the
    | users are actually retrieved out of your database or other storage
    | mechanisms to authenticate a user.
    |
    | If you have multiple user tables or models, you may configure multiple
    | sources and providers. You may also specify a table or a model that
    | serves as your user table.
    |
    */

    'providers' => [
        'users' => [ // Keep this, even if not explicitly used, as it's a Laravel default.
            'driver' => 'eloquent',
            'model' => App\Models\User::class,
        ],
        'companies' => [ // Provider for Company model
            'driver' => 'eloquent',
            'model' => App\Models\Company::class,
        ],
        'employees' => [ // Provider for Employee model
            'driver' => 'eloquent',
            'model' => App\Models\Employee::class,
        ],
        // IMPORTANT: The custom provider that combines both for Sanctum
        'multi_auth_provider' => [
            'driver' => 'eloquent_multi', // This is the custom driver name you registered
            'models' => [ // List the models that can be authenticated by this provider
                App\Models\Company::class,
                App\Models\Employee::class,
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Resetting Passwords
    |--------------------------------------------------------------------------
    |
    | You may specify multiple password reset configurations, or just a single
    | one. The point of this configuration is to provide a consistent way to
    | reset passwords across various user types and models.
    |
    | The expire time is the number of minutes that the reset token should be
    | considered valid. This security feature keeps tokens from lingering
    | indefinitely and being abused.
    |
    */

    'passwords' => [
        'users' => [
            'provider' => 'users',
            'table' => 'password_reset_tokens',
            'expire' => 60,
            'throttle' => 60,
        ],
        'companies' => [ // Add this for company password resets if needed later
            'provider' => 'companies',
            'table' => 'password_reset_tokens',
            'expire' => 60,
            'throttle' => 60,
        ],
        'employees' => [ // Add this for employee password resets if needed later
            'provider' => 'employees',
            'table' => 'password_reset_tokens',
            'expire' => 60,
            'throttle' => 60,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Password Confirmation Timeout
    |--------------------------------------------------------------------------
    |
    | Here you may define the amount of seconds before a password confirmation
    | times out and the user is prompted to re-enter their password via the
    | confirmation screen. By default, the timeout lasts for three hours.
    |
    */

    'password_timeout' => 10800,

];
