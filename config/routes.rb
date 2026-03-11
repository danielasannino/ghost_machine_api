Rails.application.routes.draw do
  root "home#index"
  get "up" => "rails/health#show", as: :rails_health_check

  resources :rooms, only: [ :index, :show ]
  resources :players, only: [ :update, :show ] do
    collection do
      post :join, to: "players#create" # Keeps your joining logic clean
    end
  end
end
