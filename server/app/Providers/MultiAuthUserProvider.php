<?php

namespace App\Providers;

use Illuminate\Auth\EloquentUserProvider;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Str;

class MultiAuthUserProvider extends EloquentUserProvider
{
    /**
     * The models that can be authenticated by this provider.
     *
     * @var array
     */
    protected $models;

    /**
     * Create a new database user provider.
     *
     * @param  \Illuminate\Contracts\Hashing\Hasher  $hasher
     * @param  array  $models
     * @return void
     */
    public function __construct($hasher, array $models)
    {
        $this->models = $models;
        // The parent constructor expects a single model name.
        // We pass the first model, but our custom logic will iterate through all.
        parent::__construct($hasher, $models[0] ?? null);
    }

    /**
     * Retrieve a user by their unique identifier.
     *
     * @param  mixed  $identifier
     * @return \Illuminate\Contracts\Auth\Authenticatable|null
     */
    public function retrieveById($identifier)
    {
        foreach ($this->models as $modelClass) {
            $model = new $modelClass;
            $user = $model->newQuery()->find($identifier);
            if ($user) {
                return $user;
            }
        }
        return null;
    }

    /**
     * Retrieve a user by their unique identifier and "remember me" token.
     *
     * @param  mixed  $identifier
     * @param  string  $token
     * @return \Illuminate\Contracts\Auth\Authenticatable|null
     */
    public function retrieveByToken($identifier, $token)
    {
        foreach ($this->models as $modelClass) {
            $model = new $modelClass;
            $retrievedModel = $model->newQuery()
                                    ->where($model->getAuthIdentifierName(), $identifier)
                                    ->where($model->getRememberTokenName(), $token)
                                    ->first();
            if ($retrievedModel) {
                return $retrievedModel;
            }
        }
        return null;
    }

    /**
     * Update the "remember me" token for the given user in storage.
     *
     * @param  \Illuminate\Contracts\Auth\Authenticatable  $user
     * @param  string  $token
     * @return void
     */
    public function updateRememberToken(Authenticatable $user, $token)
    {
        // This method is primarily for session-based "remember me" functionality.
        // For API tokens, Sanctum manages tokens in personal_access_tokens table.
        // However, the Authenticatable contract requires it.
        if (method_exists($user, 'setRememberToken') && method_exists($user, 'save')) {
            $user->setRememberToken($token);
            $user->save();
        }
    }

    /**
     * Retrieve a user by the given credentials.
     *
     * @param  array  $credentials
     * @return \Illuminate\Contracts\Auth\Authenticatable|null
     */
    public function retrieveByCredentials(array $credentials)
    {
        if (empty($credentials)) {
            return null;
        }

        foreach ($this->models as $modelClass) {
            $model = new $modelClass;
            $query = $model->newQuery();

            foreach ($credentials as $key => $value) {
                if (! Str::contains($key, 'password')) {
                    $query->where($key, $value);
                }
            }

            $user = $query->first();
            if ($user) {
                return $user;
            }
        }

        return null;
    }

    /**
     * Validate a user against the given credentials.
     *
     * @param  \Illuminate\Contracts\Auth\Authenticatable  $user
     * @param  array  $credentials
     * @return bool
     */
    public function validateCredentials(Authenticatable $user, array $credentials)
    {
        $plain = $credentials['password'];

        return $this->hasher->check($plain, $user->getAuthPassword());
    }
}
