class Ability
  include CanCan::Ability

  def initialize user
    if user
      if user.admin?
        can :manage, :all
      else
        microbase_ids = user.microbases.pluck('microbases.id')
        can :manage, Microbase, id: microbase_ids
        can :manage, Game, microbase_id: microbase_ids
        can :manage, user
      end
    end
  end
end
