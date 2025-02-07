Fabricator(:coupon) do
	code { 'ILIKEFREESTUFF' }
	upgrades_to { 'premium' }
	upgrade_length_in_days { 3 }
end