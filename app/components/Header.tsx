"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  useAuthenticator, 
  Flex, 
  Heading, 
  Avatar, 
  Button, 
  Text,
  Menu,
  MenuItem,
  View
} from "@aws-amplify/ui-react";

interface HeaderProps {
  userName: string | undefined;
}

export default function Header({ userName }: HeaderProps) {
  const { signOut } = useAuthenticator();
  const router = useRouter();
  const handleSignOut = () => {
    signOut();
    router.push('/');
  };

  // アバターの文字を取得（ユーザー名の最初の文字）
  const avatarText = userName ? userName[0].toUpperCase() : 'G';

  return (
    <Flex
      as="header"
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      padding="1rem"
      className="header-container"
    >
                  <Flex alignItems="center" gap="0.5rem">
              <View
                fontSize="1.5rem"
                color="#0066FF"
                marginRight="0.5rem"
              >
                📝
              </View>
              <Link href="/documents" style={{ textDecoration: 'none' }}>
              <Heading level={3}>
                Contract Checker
              </Heading>
              </Link>
            </Flex>
      
      <Flex alignItems="center" gap="0.5rem">
        
        <Menu 
          trigger={
            <Avatar
              className="account-avatar"
              alt={`${userName || 'ゲスト'}のアバター`}
            >
              {avatarText}
            </Avatar>
          }
        >
          <MenuItem>
          {`${userName}さん`}
          </MenuItem>
          <MenuItem onClick={handleSignOut}>
            ログアウト
          </MenuItem>
        </Menu>
      </Flex>
    </Flex>
  );
} 