// Example project file to demonstrate the tool

export class UserService {
  private users: Map<string, User>;

  constructor() {
    this.users = new Map();
  }

  /**
   * Create a new user
   */
  async createUser(userData: CreateUserDto): Promise<User> {
    const user: User = {
      id: this.generateId(),
      ...userData,
      createdAt: new Date()
    };

    this.users.set(user.id, user);
    return user;
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  /**
   * Update user information
   */
  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const user = this.users.get(id);
    
    if (!user) {
      return null;
    }

    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    
    return updatedUser;
  }

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

interface CreateUserDto {
  name: string;
  email: string;
}
