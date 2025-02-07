module ApplicationHelper
  def action title, link, classes=nil
    content_for :action do
      link_to title, link, class: classes
    end
  end

  def actions
    content_for :action do
      link_to raw('<i class="icon-th-list icon-white"></i>'), '#', class: 'actions-toggle'
    end
    yield
  end

  def back title, link
    content_for :back do
      link_to title, link
    end
  end

  def collapsible_toolbar
    html = content_tag 'a', class: 'btn btn-toggle', 'data-toggle' => 'collapse',
      'data-target' => '.btn-toolbar-collapse' do
      content_tag('span', '', class: 'icon-bar') * 3
    end
    html += content_tag 'div', class: 'btn-toolbar btn-toolbar-collapse collapse' do
      yield
    end
    raw html
  end

  def facebook_sign_in_url(rerequest: false)
    client_id = ENV['FACEBOOK_APP_ID']
    url = "https://www.facebook.com/dialog/oauth?client_id=#{client_id}&redirect_uri=#{auth_url}&scope=email&display=#{request.format == 'mobile' ? 'touch' : 'page'}"
    url += '&auth_type=rerequest' if rerequest
    url
  end

  def listing(items, **opts)
    listing = Listing.new(items, self, **opts)
    yield listing
    listing.render
  end

  def markdown text
    raw redcarpet.render(text)
  end

  def scripts *scripts
    content_for(:scripts) { javascript_include_tag *scripts }
  end

  def title title
    @title = title
  end
end
