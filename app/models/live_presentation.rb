require 'securerandom'

class LivePresentation
  LIVE_SERVER_URL = "http://127.0.0.1:8040/"

  def self.create
    response = RestClient.post(LIVE_SERVER_URL, token: generate_token)
    if response.code == 201
      data = JSON.parse(response.body)
      new data['presentation']
    else
      nil
    end
  rescue => e
    Rails.logger.error "Error creating a new live presentation on node server, #{e.message}"
    nil
  end

  def self.generate_token
    SecureRandom.hex
  end

  attr :id, :token

  def initialize(data)
    Rails.logger.debug data.inspect
    @id    = data['id']
    @token = data['token']
  end

  def as_json(options=nil)
    {
      'id' => id,
      'token' => token,
    }
  end
end
