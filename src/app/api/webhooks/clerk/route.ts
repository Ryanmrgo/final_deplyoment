import { Webhook } from 'svix';
import { headers } from 'next/headers';
import User from '@/models/User';
import connectDB from '@/config/db';

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are missing headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');

  let evt: any;
  // Verify the webhook
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400,
    });
  }

  await connectDB();

  // Handle different event types
  const eventType = evt.type;

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url } =
      evt.data;

    const email = email_addresses[0]?.email_address;
    const name = `${first_name || ''} ${last_name || ''}`.trim();

    try {
      // Use findByIdAndUpdate to create or update
      const user = await User.findByIdAndUpdate(
        id,
        {
          _id: id,
          email,
          name,
          imageUrl: image_url,
        },
        { upsert: true, new: true }
      );

      return new Response(JSON.stringify({ success: true, user }), {
        status: 200,
      });
    } catch (error) {
      console.error('Error syncing user:', error);
      return new Response('Error syncing user', { status: 500 });
    }
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data;

    try {
      await User.findByIdAndDelete(id);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      return new Response('Error deleting user', { status: 500 });
    }
  }

  return new Response('', { status: 200 });
}
