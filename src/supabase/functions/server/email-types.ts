export interface FeaturedTake {
  text: string;
  agrees: number;
  disagrees: number;
}

export interface ConversationUpdate {
  title: string;
  newTakes: number;
  newVotes: number;
  featuredTakes: FeaturedTake[];
}

export interface TakeUpdate {
  text: string;
  conversationTitle: string;
  agrees: number;
  disagrees: number;
  totalVotes: number;
}

export interface ParticipatedConversation {
  title: string;
  newTakes: number;
  newVotes: number;
  featuredTake: FeaturedTake;
}

export interface FeaturedConvo {
  title: string;
  newTakes: number;
  totalParticipants: number;
}

export interface CommunityUpdate {
  name: string;
  newConversations: number;
  activeMembers: number;
  featuredConvo: FeaturedConvo;
}

export interface EmailData {
  conversationsStarted: ConversationUpdate[];
  takesPosted: TakeUpdate[];
  conversationsParticipated: ParticipatedConversation[];
  communities: CommunityUpdate[];
}

export interface SubHeardMembership {
  userId: string;
  subHeard: string;
}