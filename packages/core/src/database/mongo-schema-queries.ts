import type { Model } from 'mongoose';

export default class MongoSchemaQueries<Schema extends { id: string }> {
  constructor(protected readonly model: Model<Schema>) {}

  async findAll(limit = 20, offset = 0): Promise<[number, Schema[]]> {
    const [count, docs] = await Promise.all([
      this.model.countDocuments({}),
      this.model.find({}).skip(offset).limit(limit).lean<Schema>().exec(),
    ]);
    return [count, docs];
  }

  async findById(id: string): Promise<Schema | null> {
    return this.model.findOne({ id }).lean<Schema>().exec();
  }

  async insert(data: Schema): Promise<Schema> {
    const doc = await this.model.create(data);
    return doc.toObject();
  }

  async updateById(id: string, data: Partial<Schema>): Promise<Schema | null> {
    return this.model
      .findOneAndUpdate({ id }, data, { new: true })
      .lean<Schema>()
      .exec();
  }

  async deleteById(id: string): Promise<void> {
    await this.model.deleteOne({ id }).exec();
  }
}
