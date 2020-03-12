import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useLazyQuery } from '@apollo/react-hooks';

import { Avatar } from "baseui/avatar";
import ArrowLeft from 'baseui/icon/arrow-left'
import { Button } from "baseui/button";
import { toaster, ToasterContainer, PLACEMENT } from "baseui/toast";
import s from './styles.module.scss';
import gql from 'graphql-tag';

const PUBLISH_DRAFT = gql`
  mutation publishDraft(
    $_id: ID!
  ) {
    publishDraft(
      _id: $_id
    ) {
      _id
      name
      email
      drafts {
        _id
        title
        content
      }
      posts {
        _id
        title
        content
      }
    }
  }
`

const GET_AUTHOR = gql`
  query Author($_id: ID!) {
    draft(_id: $_id) {
      _id
      author {
        email
        name
        avatar
      }
    }
  }
`

const GET_LOGGED_USER = gql`
  query getLoggedUser {
    me {
      email
    }
  }
`

const EditorHeader = ({ match, history }) => {
  const [ isAuthor, setIsAuthor ] = useState(false);

  const [ publishDraft ] = useMutation(PUBLISH_DRAFT);
  const [ getUser, { data: loggedUser } ] = useLazyQuery(GET_LOGGED_USER);
  const { data: author } = useQuery(GET_AUTHOR, {
    variables: {
      _id: match.params.id
    }, 
    onCompleted() {
      getUser()
    }
  });
  
  useEffect(() => {
    if (loggedUser && author) {
      setIsAuthor(loggedUser.me.email === author.draft.author.email)
    }
  }, [loggedUser])

  useEffect(() => {
    console.log(author)
  })

  const handlePublish = async () => {
    try {
      await publishDraft({ variables: { _id: author.draft._id } });
      history.push(`/editor/post/${author.draft._id}`)
    } catch (error) {
      toaster.negative(error.message)
    }
  }

  return (
    <ToasterContainer placement={PLACEMENT.bottomRight} >
      <div className={s.container}>
        <div className={s.left}>
          <div className={s.back} onClick={() => history.push('/editor')}>
            <ArrowLeft size={50}/>
          </div>
          {author &&
            <div className={s.author}>
              <Avatar size={'50px'} name={author.draft.author.name} src={author.draft.author.avatar} />
              <div className={s.name}>{author.draft.author.name}</div>
            </div>
          }
        </div>
        {isAuthor && match.path === "/editor/draft/:id" ? 
          <Button
            onClick={handlePublish}
            overrides={{
              BaseButton: {
                style: {
                  height: '30px',
                  padding: '5px 10px',
                }
              }
            }}
          >
            Publish
          </Button> : 
          <Button
            onClick={() => alert("click")}
            overrides={{
              BaseButton: {
                style: {
                  height: '30px',
                  padding: '5px 10px',
                }
              }
            }}
          >
            Edit
          </Button>
        }
      </div> 
    </ToasterContainer>
  )
}

export default EditorHeader;
