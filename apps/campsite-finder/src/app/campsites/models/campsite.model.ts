import { Directive, Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'campsite' })
export class Campsite {
  @Field((type) => ID)
  id: string;
  title: string;
  description?: string;
  creationDate: Date;
  location: string[];
}
