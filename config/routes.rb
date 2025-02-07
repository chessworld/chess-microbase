Rails.application.routes.draw do
  resources :microbases do
    resources :games do
      post :move, on: :member
      post :copy, on: :member
      get :embed, on: :member
    end
    resources :memberships do
      post :accept, on: :member
    end

    get :remove, on: :member
    get :embed, on: :member
    match :import, via: [:get, :post], on: :member
  end
  resources :sessions, only: [:create, :destroy, :new] do
    get :switch_format, on: :collection
  end
  resources :users do
    get :confirm, on: :member
    match :upgrade, on: :member, via: [:get, :put]
    match :recover_password, via: [:get, :post], on: :collection
    post :redeem, on: :collection
    resources :upgrades, only: [:create]
  end
  resources :coupons
  resources :live_presentations, only: :create

  resource :search, only: :show

  get 'm/:token' => 'jump#microbase', as: :microbase_jump
  get 'g/:token' => 'jump#game', as: :game_jump

  get 'diagrams/*fen' => 'diagrams#show', as: :diagram

  match 'auth' => 'sessions#create', as: :auth, via: [:get, :post]

  get 'pages/home' => 'pages#home'

  resource :health_check, only: :show

  root to: 'pages#home'
end
