import { 
  getEventBus, 
  UserEventFactory, 
  UserRegisteredEvent,
  UserLoggedInEvent 
} from '@microservices/shared';

export class EventPublisher {
  private eventBus = getEventBus();

  async publishUserRegistered(
    userId: string,
    email: string,
    firstName: string,
    lastName: string,
    role: string
  ): Promise<void> {
    const event = UserEventFactory.createUserRegisteredEvent(
      userId,
      email,
      firstName,
      lastName,
      role as any,
      'web'
    );

    await this.eventBus.publish(event);
  }

  async publishUserLoggedIn(
    userId: string,
    email: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const event = UserEventFactory.createUserLoggedInEvent(
      userId,
      email,
      ipAddress,
      userAgent
    );

    await this.eventBus.publish(event);
  }
}