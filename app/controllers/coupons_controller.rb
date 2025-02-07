class CouponsController < ApplicationController
  before_action :require_admin

  def index
    @coupons = Coupon.page(params[:page])
  end

  def show
    @coupon = Coupon.find(params[:id])

    respond_to do |format|
      format.html # show.html.erb
      format.json { render json: @coupon }
    end
  end

  def new
    @coupon = Coupon.new(
      upgrades_to: 'premium',
      upgrade_length_in_days: 7
    )

    respond_to do |format|
      format.html # new.html.erb
      format.json { render json: @coupon }
    end
  end

  def edit
    @coupon = Coupon.find(params[:id])
  end

  def create
    @coupon = Coupon.new(params[:coupon])

    respond_to do |format|
      if @coupon.save
        format.html { redirect_to @coupon, notice: 'Coupon was successfully created.' }
        format.json { render json: @coupon, status: :created, location: @coupon }
      else
        format.html { render action: "new" }
        format.json { render json: @coupon.errors, status: :unprocessable_entity }
      end
    end
  end

  def update
    @coupon = Coupon.find(params[:id])

    respond_to do |format|
      if @coupon.update(params[:coupon])
        format.html { redirect_to @coupon, notice: 'Coupon was successfully updated.' }
        format.json { head :no_content }
      else
        format.html { render action: "edit" }
        format.json { render json: @coupon.errors, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    @coupon = Coupon.find(params[:id])
    @coupon.destroy

    respond_to do |format|
      format.html { redirect_to coupons_url }
      format.json { head :no_content }
    end
  end
end
