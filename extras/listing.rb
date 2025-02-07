# encoding: UTF-8

class Listing
  attr :default_sort
  attr :default_sort_reverse

  def initialize(collection, helper, **options)
    @collection = collection
    raise 'collection missing' if collection.nil?
    raise 'helper missing' if helper.nil?
    @helper = helper
    @columns = []
    @filters = []
    @preserve_params = []
    @class = options[:class] || ''
    @url = options[:url] || helper.url_for(collection)
    @default_sort = options[:default_sort] || nil
    @default_sort_reverse = options[:default_sort_reverse] || false
  end

  def active_filters
    @active_filters ||= begin
      active_filters = []
      if filters_param = param('filters')
        filters_param.split(',').each do |name|
          active_filters.push name if @filters.any?{ |filter| filter[:name] == name }
        end
      end
      active_filters
    end
  end

  def column(name, **opts, &block)
    @columns.push(
      name:    name,
      options: opts,
      block:   block
    )
  end

  def filter(name, options={}, &proc)
    @filters.push(
      name:     name,
      options:  options,
      label:    options[:label] || name.titlecase,
      proc:     proc
    )
  end

  def preserve_param(name)
    @preserve_params << name.to_s
  end

  def render
    html = ''
    render_filters html if @filters.any?
    html << %(<table class="#{@class}"><thead><tr>)
    render_column_headers html
    html << %(</tr></thead><tbody>)
    render_rows html
    html << %(</tbody></table>)
    html << (@helper.will_paginate(paginated_collection) || '')
    html.html_safe
  end

  def sort
    @sort ||= begin
      sort_param = param('sort')
      if sort_param.present? && @columns.any?{ |column| column[:name] == sort_param }
        sort_param
      else
        raise "Default sort not specified" unless @default_sort
        @default_sort
      end
    end
  end

  def sort_order
    "#{sort_sql sort} #{sort_reverse ? 'desc' : 'asc'}"
  end

  def sort_reverse
    @sort_reverse ||= begin
      case param('reverse')
        when 'yes'
          true
        when 'no'
          false
        else
          @default_sort_reverse
      end
    end
  end

private

  def filter_proc name
    filter = @filters.find{|filter| filter[:name] == name }
    filter[:proc]
  end

  def filter_url(name, on)
    new_filters = active_filters.dup
    if on
      new_filters.push name unless new_filters.include?(name)
      found = @filters.find{ |filter| filter[:name] == name }
      if found && found[:options][:cancels]
        found[:options][:cancels].each do |cancels_name|
          new_filters.delete cancels_name
        end
      end
    else
      new_filters.delete name
    end
    url = "#{@url}?filters=#{new_filters.join(',')}"
    if sort != @default_sort || sort_reverse != @default_sort_reverse
      url << "&amp;sort=#{sort}&amp;reverse=#{sort_reverse ? 'yes' : 'no'}"
    end
    url
  end

  def paginated_collection
    @paginated_collection ||= begin
      collection = @collection
      collection = collection.reorder(sort_order) if sort
      active_filters.each do |name|
        collection = filter_proc(name).call(collection)
      end
      collection.paginate(page: param('page'))
    end
  end

  def param(name)
    @helper.params[name]
  end

  def render_column_headers(html)
    @columns.each do |column|
      html << '<th>'
      if column[:name]
        html << '<a '
        if sort == column[:name]
          html << %( class="sorted_#{sort_reverse ? 'up' : 'down'}")
        end
        html << %( href="#{sort_url(column[:name], (column[:name] == sort) ? !sort_reverse : false)}">)
      end
      html << "#{column[:options][:label] || column[:name].titlecase}"
      html << '</a>' if column[:name]
      html << '</th>'
    end
  end

  def render_filters(html)
    html << '<ul class="filters"><li><b>Refine: </b></li>'
    @filters.each do |filter|
      html << '<li>'
      if active_filters.include? filter[:name]
        html << %(<b>#{filter[:label]}</b><a class="close" href="#{filter_url filter[:name], false}">X</a>)
      else
        html << %(<a href="#{filter_url filter[:name], true}">#{filter[:label]}</a>)
      end
      html << '</li>'
    end
    html << '</ul>'
  end

  def render_rows(html)
    paginated_collection.each do |item|
      html << %(<tr>)
      @columns.each do |column|
        html << %(<td>#{@helper.capture item, &column[:block]}</td>)
      end
      html << %(</tr>)
    end
  end

  def sort_sql(name)
    column = @columns.find{ |column| column[:name] == name }
    raise "Column for sort '#{name}' not found" unless column
    column[:options][:order] ? "(#{column[:options][:order]})" : "\"#{column[:name]}\""
  end

  def sort_url(sort, sort_reverse=false)
    url = "#{@url}?sort=#{CGI.escape sort}&amp;reverse=#{sort_reverse ? 'yes' : 'no'}"
    url << "&amp;filters=#{CGI.escape active_filters.join(',')}" if active_filters.any?
    @preserve_params.each do |name|
      url << "&amp;#{CGI.escape name}=#{CGI.escape param(name)}" if param(name)
    end
    url
  end
end
